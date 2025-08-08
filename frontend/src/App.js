import React, { useState, useCallback } from 'react';
import { Upload, FileText, Clock, CheckCircle2, AlertCircle, Download, Eye, Building2, Package, Info } from 'lucide-react';

const InvoiceExtractor = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload only PDF files.');
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload only PDF files.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/extract-invoice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Processing failed');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the Flask server is running on localhost:5000');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;
    
    const content = result.data.raw_text;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_extracted_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoice Document Extractor</h1>
                <p className="text-gray-600 mt-1">Professional document processing with AI-powered extraction</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
              {/* <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Azure OCR</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>DeepSeek AI</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Invoice
                </h2>
              </div>
              
              <div className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : file 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">Drop your PDF here</p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!file || isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Extract Data'
                    )}
                  </button>
                  
                  {(file || result) && (
                    <button
                      onClick={resetForm}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {isProcessing && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Invoice</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center justify-center"><Clock className="w-4 h-4 mr-2" />Extracting text and structuring it...</p>
                      {/* <p className="flex items-center justify-center"><Package className="w-4 h-4 mr-2" />Structuring data with DeepSeek AI...</p> */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Processing Stats */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                      Processing Complete
                    </h3>
                    {/* <button
                      onClick={downloadResults}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button> */}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-blue-600">{result.processing_time.ocr_time}s</p>
                      <p className="text-sm text-gray-600">OCR Time</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-indigo-600">{result.processing_time.structure_time}s</p>
                      <p className="text-sm text-gray-600">AI Structure</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-600">{result.processing_time.total_time}s</p>
                      <p className="text-sm text-gray-600">Total Time</p>
                    </div>
                  </div>
                </div>

                {/* ERP Formatted Results */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      ERP Structured Data
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    {/* Header Fields */}
                    {Object.keys(result.data.header_fields).length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                          <Building2 className="w-4 h-4 mr-2" />
                          Invoice Header
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {Object.entries(result.data.header_fields).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-gray-600 w-32 flex-shrink-0">{key}:</span>
                                <span className="text-gray-900 font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    {result.data.items.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          Line Items
                        </h4>
                        <div className="space-y-4">
                          {result.data.items.map((item, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                              <h5 className="font-semibold text-blue-900 mb-3">{item.title}</h5>
                              <div className="bg-white rounded p-3 font-mono text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                  {Object.entries(item.fields).map(([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="text-gray-600 w-24 flex-shrink-0">{key}:</span>
                                      <span className="text-gray-900">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Fields */}
                    {Object.keys(result.data.additional_fields).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          Additional Information
                        </h4>
                        <div className="bg-yellow-50 rounded-lg p-4 font-mono text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {Object.entries(result.data.additional_fields).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-gray-600 w-32 flex-shrink-0">{key}:</span>
                                <span className="text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && !result && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Process</h3>
                <p className="text-gray-600">Upload a PDF invoice to see the extracted ERP-formatted data here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceExtractor;