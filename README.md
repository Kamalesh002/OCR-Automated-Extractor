# 🤖 InvoiceSync: Automated Invoice Processing API

**Created By: Kamalesh Kumar S**

InvoiceSync is a sophisticated, API-driven system designed to extract and structure data from PDF invoices. It leverages **Azure Document Intelligence** for high-accuracy OCR and **OpenAI's DeepSeek model** via OpenRouter for intelligent data formatting, seamlessly preparing data for ERP integration.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

---

## ✨ Core Features

* **Intelligent Data Structuring**: Automatically organizes messy OCR output into clean, ERP-friendly sections like `header_fields`, `items`, and `additional_fields`.
* **High-Accuracy OCR**: Utilizes Azure's pre-trained layout model to extract raw text with precision.
* **Secure & Ephemeral File Handling**: Processes uploads in temporary, secure storage with guaranteed cleanup after every request.
* **Robust File Validation**: Ensures system stability by accepting only PDF files.
* **Performance Monitoring**: Tracks processing times for both OCR and data structuring steps to identify bottlenecks.
* **Comprehensive Error Handling**: Gracefully manages file errors, API issues, and missing configurations.
* **CORS Enabled**: Ready for integration with any modern web application frontend.

---

## 🏛️ System Architecture

InvoiceSync employs a modular, cloud-native architecture for high performance and scalability.

**Workflow:**
`PDF Upload` ➔ `Flask API` ➔ `Azure Document Intelligence (OCR)` ➔ `OpenAI DeepSeek (Structuring)` ➔ `Structured JSON Output`

**Technology Stack:**
* **Backend Framework**: Flask
* **OCR Engine**: Azure Document Intelligence (`prebuilt-layout` model)
* **Data Structuring**: OpenAI DeepSeek via OpenRouter API
* **Security**: `python-dotenv` for managing environment variables
* **File Handling**: `tempfile` for secure, temporary storage
* **CORS**: `Flask-CORS` for cross-origin communication

---


git clone <your-repository-url>
cd invoicesync
