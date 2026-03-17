"use client";

import Modal from "@/components/common/Modal";

interface TourismDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  content: string | string[];
  type: 'description' | 'bestTime' | 'visitTime' | 'safety' | 'languages';
}

export default function TourismDetailModal({
  isOpen,
  onClose,
  title,
  icon,
  content,
  type,
}: TourismDetailModalProps) {
  const renderContent = () => {
    if (Array.isArray(content)) {
      return (
        <div className="space-y-3">
          {content.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-lg">✓</span>
              <span className="text-gray-700 font-semibold">{item}</span>
            </div>
          ))}
        </div>
      );
    }

    // For description, split into paragraphs
    if (type === 'description') {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      return (
        <div className="space-y-4">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-gray-700 leading-relaxed font-semibold text-base">
              {para}
            </p>
          ))}
        </div>
      );
    }

    return <p className="text-gray-700 leading-relaxed font-semibold text-base">{content}</p>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${icon} ${title}`} size="lg">
      <div className="space-y-6">
        {/* Content */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          {renderContent()}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-bold mb-1">More Information</p>
            <p className="text-sm text-blue-100">
              {type === 'description' && 'This is the complete description of this tourism place. Plan your visit accordingly.'}
              {type === 'bestTime' && 'Visit during these months for the best experience and weather conditions.'}
              {type === 'visitTime' && 'Recommended duration to fully explore and enjoy this destination.'}
              {type === 'safety' && 'Safety information and travel advisories for this location.'}
              {type === 'languages' && 'Local languages spoken in this area. Consider learning basic phrases!'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-900 font-bold rounded-lg transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
