import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, MapPin, Mail, Phone, Shield, Hash, FileText, 
  CheckCircle, XCircle, Eye, EyeOff, Calendar, Copy 
} from 'lucide-react';

function KYCDataViewer({ kycData, compact = false }) {
  const [showHashes, setShowHashes] = useState(false);
  
  let parsedData;
  try {
    parsedData = typeof kycData === 'string' ? JSON.parse(kycData) : kycData;
  } catch (e) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">Invalid KYC data format</p>
        <pre className="mt-2 text-xs text-gray-600 overflow-auto">{kycData}</pre>
      </div>
    );
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Check if this is new format (with hashes) or old format
  const isNewFormat = parsedData.personalInfo && parsedData.identity;

  if (!isNewFormat) {
    // Old format - display as-is
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Legacy Format:</p>
        <pre className="text-xs text-gray-700 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(parsedData, null, 2)}
        </pre>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-purple-500" />
          <span className="font-semibold">{parsedData.personalInfo.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Mail className="w-3 h-3" />
          {parsedData.personalInfo.email}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Shield className="w-3 h-3" />
          {parsedData.identity.idType}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Personal Information
        </h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600 text-xs mb-1">Full Name</p>
            <p className="font-semibold text-gray-900">{parsedData.personalInfo.fullName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Date of Birth</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {parsedData.personalInfo.dateOfBirth}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Email</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {parsedData.personalInfo.email}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Phone</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {parsedData.personalInfo.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Address
        </h5>
        <div className="text-sm space-y-2">
          <p className="text-gray-900">{parsedData.address.street}</p>
          <p className="text-gray-700">
            {parsedData.address.city}, {parsedData.address.state} - {parsedData.address.pincode}
          </p>
        </div>
      </div>

      {/* Identity Verification (Hashed) */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Identity Verification (Encrypted)
          </h5>
          <button
            onClick={() => setShowHashes(!showHashes)}
            className="text-xs px-3 py-1 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            {showHashes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showHashes ? 'Hide' : 'Show'} Hashes
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-gray-600 text-xs mb-1">ID Type</p>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {parsedData.identity.idType}
            </p>
          </div>

          {showHashes && (
            <>
              <div>
                <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  ID Number Hash (SHA-256)
                </p>
                <div className="bg-white p-2 rounded-lg border border-green-300 group relative">
                  <p className="font-mono text-xs text-gray-700 break-all">
                    {parsedData.identity.idNumberHash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(parsedData.identity.idNumberHash)}
                    className="absolute top-1 right-1 p-1 bg-green-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy hash"
                  >
                    <Copy className="w-3 h-3 text-green-700" />
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Original ID number is NOT stored - only encrypted hash
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Document Hash (SHA-256)
                </p>
                <div className="bg-white p-2 rounded-lg border border-green-300 group relative">
                  <p className="font-mono text-xs text-gray-700 break-all">
                    {parsedData.identity.documentHash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(parsedData.identity.documentHash)}
                    className="absolute top-1 right-1 p-1 bg-green-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy hash"
                  >
                    <Copy className="w-3 h-3 text-green-700" />
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Original document is NOT stored - only encrypted hash
                </p>
              </div>

              {parsedData.identity.documentMetadata && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-xs mb-2 font-semibold">Document Metadata:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-1 text-gray-700">{parsedData.identity.documentMetadata.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-1 text-gray-700">
                        {(parsedData.identity.documentMetadata.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 text-gray-700">{parsedData.identity.documentMetadata.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Verification Info */}
      {parsedData.verification && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-semibold">Verification Details:</p>
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Submitted: {new Date(parsedData.verification.submittedAt).toLocaleString()}</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono">
              {parsedData.verification.hashAlgorithm}
            </span>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-800">
            <p className="font-semibold mb-1">Privacy Protected</p>
            <p>Sensitive data (ID numbers, documents) are stored as SHA-256 hashes only. Original data is never stored on IPFS or blockchain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KYCDataViewer;
