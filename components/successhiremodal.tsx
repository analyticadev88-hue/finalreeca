import React from "react";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Success!</h2>
        <p className="text-gray-700 mb-4">Your inquiry has been submitted successfully.</p>
        <button
          onClick={onClose}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
