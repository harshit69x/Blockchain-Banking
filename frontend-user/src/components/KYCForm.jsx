import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Calendar, MapPin, Mail, Phone, Upload, FileText, 
  Shield, AlertCircle, CheckCircle, Hash, X 
} from 'lucide-react';
import { hashFile, hashIDNumber, getFileMetadata } from '../utils/hashUtils';

const ID_TYPES = [
  { value: 'AADHAR', label: 'Aadhar Card', pattern: /^\d{12}$/, placeholder: '123456789012' },
  { value: 'PAN', label: 'PAN Card', pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, placeholder: 'ABCDE1234F' },
  { value: 'PASSPORT', label: 'Passport', pattern: /^[A-Z]{1}[0-9]{7}$/, placeholder: 'A1234567' },
  { value: 'DRIVING_LICENSE', label: 'Driving License', pattern: /^[A-Z0-9]{6,20}$/, placeholder: 'DL1234567890' },
  { value: 'VOTER_ID', label: 'Voter ID', pattern: /^[A-Z]{3}[0-9]{7}$/, placeholder: 'ABC1234567' }
];

function KYCForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    phone: '',
    idType: 'AADHAR',
    idNumber: ''
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [documentHash, setDocumentHash] = useState('');
  const [idNumberHash, setIdNumberHash] = useState('');
  const [errors, setErrors] = useState({});
  const [isHashing, setIsHashing] = useState(false);

  const selectedIDType = ID_TYPES.find(type => type.value === formData.idType);

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return value.length < 3 ? 'Name must be at least 3 characters' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : '';
      case 'phone':
        return !/^\+?[0-9]{10,15}$/.test(value) ? 'Invalid phone number' : '';
      case 'pincode':
        return !/^\d{6}$/.test(value) ? 'Invalid pincode' : '';
      case 'idNumber':
        return !selectedIDType.pattern.test(value) ? `Invalid ${selectedIDType.label} format` : '';
      case 'dateOfBirth':
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age < 18 ? 'Must be 18 years or older' : '';
      default:
        return value.trim() === '' ? 'This field is required' : '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        document: 'Only PDF, JPG, and PNG files are allowed' 
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        document: 'File size must be less than 5MB' 
      }));
      return;
    }

    setDocumentFile(file);
    setErrors(prev => ({ ...prev, document: '' }));

    // Hash the file
    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setDocumentHash(hash);
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        document: 'Failed to process document' 
      }));
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    // Document upload is now optional
    // if (!documentFile) {
    //   newErrors.document = 'Please upload an ID document';
    // }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Hash ID number
    setIsHashing(true);
    try {
      const { hash: idHash } = await hashIDNumber(formData.idNumber, formData.idType);
      setIdNumberHash(idHash);

      // Prepare KYC data with hashes (NO PLAIN TEXT SENSITIVE DATA)
      const kycData = {
        personalInfo: {
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email,
          phone: formData.phone
        },
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        identity: {
          idType: formData.idType,
          idNumberHash: idHash, // Only hash stored, NOT plain number
          documentHash: documentFile ? documentHash : 'not-provided', // Optional document
          documentMetadata: documentFile ? getFileMetadata(documentFile) : null
        },
        verification: {
          submittedAt: new Date().toISOString(),
          hashAlgorithm: 'SHA-256'
        }
      };

      // Submit to parent
      await onSubmit(kycData);

    } catch (error) {
      console.error('KYC submission error:', error);
      setErrors({ submit: error.message || 'Failed to process KYC data' });
    } finally {
      setIsHashing(false);
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setDocumentHash('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Personal Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            {errors.fullName && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.dateOfBirth}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Address Details
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street, Apartment 4B"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                errors.address ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {errors.address && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.city ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.city && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.city}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.state ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.state && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.state}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="400001"
                maxLength="6"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.pincode ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.pincode && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.pincode}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Verification Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Identity Verification
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Type *
            </label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            >
              {ID_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Number *
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder={selectedIDType.placeholder}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-200 outline-none transition-all uppercase ${
                errors.idNumber ? 'border-red-500' : 'border-gray-200 focus:border-green-500'
              }`}
            />
            {errors.idNumber && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.idNumber}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Only encrypted hash will be stored, not the actual number
            </p>
          </div>
        </div>

        {/* Document Upload - TEMPORARILY DISABLED */}
        {/* 
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload ID Document (Optional - PDF, JPG, PNG - Max 5MB)
          </label>
          ...document upload UI...
        </div>
        */}

        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Privacy & Security</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• Your ID number will be hashed using SHA-256 encryption</li>
                <li>• Only the hash will be stored on IPFS for verification</li>
                <li>• Original ID numbers are never stored or transmitted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading || isHashing}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {isHashing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Encrypting Data...
          </>
        ) : loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Submit Secure KYC Request
          </>
        )}
      </motion.button>

      {errors.submit && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.submit}
          </p>
        </div>
      )}
    </form>
  );
}

export default KYCForm;
