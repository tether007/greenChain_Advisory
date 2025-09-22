import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface SellPageProps {
  onNavigateHome: () => void;
}

interface FormData {
  name: string;
  price: string;
  quantity: string;
  description: string;
  farmer: string;
  location: string;
  images: File[];
}

const SellPage: React.FC<SellPageProps> = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    quantity: '',
    description: '',
    farmer: '',
    location: '',
    images: []
  });
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFormData({
        ...formData,
        images: [...formData.images, ...files]
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFormData({
        ...formData,
        images: [...formData.images, ...files]
      });
    }
  };

  const handleSubmit = (): void => {
    if (!formData.name || !formData.price || !formData.quantity || !formData.farmer || !formData.location || !formData.description) {
      alert('Please fill all required fields');
      return;
    }

    // Build a product record to persist
    const imageUrls = formData.images.map(f => URL.createObjectURL(f));
    const newListing = {
      id: Date.now(),
      name: formData.name,
      price: Number(formData.price),
      quantity: formData.quantity,
      image: imageUrls[0] || '',
      images: imageUrls,
      farmer: formData.farmer,
      farmerAddress: '0x0000000000000000000000000000000000000000',
      location: formData.location,
      rating: 4.5,
      description: formData.description
    };

    try {
      const existing = localStorage.getItem('marketplace_listings');
      const listings = existing ? JSON.parse(existing) : [];
      listings.push(newListing);
      localStorage.setItem('marketplace_listings', JSON.stringify(listings));
      alert('Product listed successfully!');
    } catch (e) {
      console.error('Failed to save listing', e);
      alert('Failed to save listing');
    }
    
    // Reset form
    setFormData({
      name: '',
      price: '',
      quantity: '',
      description: '',
      farmer: '',
      location: '',
      images: []
    });

    // Navigate user to buy page via home → marketplace → buy flow
    // Since this app uses internal page state, we signal by calling home; user can then choose Buy
    // If App adds a direct navigate function later, we can call it here
    const event = new CustomEvent('navigate_to_buy');
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onNavigateHome}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              ← Back to Home
            </button>
            <h1 className="text-2xl font-bold text-gray-800">List Your Product</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Product Information</h2>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images (you can add multiple)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-2">
                {formData.images.length > 0 ? `${formData.images.length} image(s) selected` : 'Drag and drop images here, or click to select'}
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-700 transition-colors"
              >
                Choose File
              </label>
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {formData.images.slice(0, 6).map((file, idx) => (
                    <div key={idx} className="w-full h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs text-gray-600 px-1">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Fresh Tomatoes"
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per kg (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 50"
            />
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Quantity *
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 100 kg"
            />
          </div>

          {/* Farmer Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              name="farmer"
              value={formData.farmer}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Karnataka, India"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe your product, farming methods, quality, etc."
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            List Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellPage;