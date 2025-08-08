import os
import tempfile
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentContentFormat
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Environment variables
azure_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
azure_endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

# Check for required environment variables
if not azure_key or not azure_endpoint or not openrouter_api_key:
    print("❌ Missing environment variables. Please check your .env file.")
    exit(1)

# Azure client
document_client = DocumentIntelligenceClient(
    endpoint=azure_endpoint,
    credential=AzureKeyCredential(azure_key)
)

# OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
)

def parse_erp_output(structured_text):
    """Parse the structured ERP text into a dictionary for better frontend display"""
    lines = structured_text.split('\n')
    parsed_data = {
        'header_fields': {},
        'items': [],
        'additional_fields': {},
        'raw_text': structured_text
    }
    
    current_section = 'header'
    current_item = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('Items:'):
            current_section = 'items'
            continue
        elif line.startswith('Additional Fields:'):
            current_section = 'additional'
            continue
        elif line.startswith('Item ') and ':' in line:
            if current_item:
                parsed_data['items'].append(current_item)
            current_item = {'title': line, 'fields': {}}
            continue
        
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            if current_section == 'header':
                parsed_data['header_fields'][key] = value
            elif current_section == 'items' and current_item:
                current_item['fields'][key] = value
            elif current_section == 'additional':
                parsed_data['additional_fields'][key] = value
    
    # Add the last item if exists
    if current_item:
        parsed_data['items'].append(current_item)
    
    return parsed_data

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask server is running!"})

@app.route('/api/extract-invoice', methods=['POST'])
def extract_invoice():
    try:
        # Check if file is uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        # Step 1: OCR Processing
        start_time = time.time()
        
        with open(tmp_path, "rb") as f:
            poller = document_client.begin_analyze_document(
                model_id="prebuilt-layout",
                body=f,
                output_content_format=DocumentContentFormat.TEXT,
                content_type="application/pdf"
            )
            result = poller.result()
        
        raw_text = result.content.strip() if result.content else ""
        ocr_time = time.time() - start_time
        
        if not raw_text:
            os.remove(tmp_path)
            return jsonify({"error": "OCR returned no text"}), 400
        
        # Step 2: Structure the data using DeepSeek
        structure_start = time.time()
        
        completion = client.chat.completions.create(
            model="deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages=[
                {
                    "role": "user",
                    "content": f"""
You are an ERP data formatter for invoice processing.

Your job is to extract relevant information from the raw OCR invoice text and organize it in a **visually aligned, human-readable ERP format**.

🔒 Strict Rules:
- Only use the data **exactly as it appears** in the OCR text below — do **not invent, infer, or guess** anything.
- If any standard field is **missing**, leave it out entirely.
- Ensure **clean spacing and alignment** for professional ERP display.
- Ignore noisy OCR symbols, special characters, scanner tags, or repeated junk.
- Keep **section order natural**, based on how fields appear in the original text.
- Group and align **item lines under "Items:"** with consistent indentation and spacing.

---

🎯 **Output Format (Text Only, No JSON, No Markdown):**

Company Name     : [if found]
GSTIN            : [if found]
Invoice Number   : [if found]
Invoice Date     : [if found]
Delivery Address : [if found]
Billing Address  : [if found]
Vehicle Number   : [if found]
Total Weight     : [if found]

Items:
Item 1:
  Description : ...
  Quantity    : ...
  Unit        : ...
  Weight      : ...
  Rate        : ...
  Amount      : ...
  HSN Code    : ...

Item 2:
  Description : ...
  Quantity    : ...
  Unit        : ...
  Weight      : ...
  Rate        : ...
  Amount      : ...
  HSN Code    : ...

Additional Fields:
  Field Label : Value
  Field Label : Value

---

📄 OCR Raw Text:
{raw_text}
"""
                }
            ]
        )
        
        structured_text = completion.choices[0].message.content.strip()
        structure_time = time.time() - structure_start
        
        # Parse the structured text for better frontend display
        parsed_data = parse_erp_output(structured_text)
        
        # Cleanup temporary file
        os.remove(tmp_path)
        
        return jsonify({
            "success": True,
            "data": parsed_data,
            "processing_time": {
                "ocr_time": round(ocr_time, 2),
                "structure_time": round(structure_time, 2),
                "total_time": round(ocr_time + structure_time, 2)
            }
        })
        
    except Exception as e:
        # Cleanup temporary file if exists
        if 'tmp_path' in locals():
            try:
                os.remove(tmp_path)
            except:
                pass
        
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📋 Make sure to set the following environment variables in your .env file:")
    print("   - AZURE_DOCUMENT_INTELLIGENCE_KEY")
    print("   - AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT") 
    print("   - OPENROUTER_API_KEY")
    app.run(debug=True, host='0.0.0.0', port=5000)