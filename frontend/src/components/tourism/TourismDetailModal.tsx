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

const typeConfig: Record<TourismDetailModalProps['type'], { accent: string; hint: string }> = {
  description: {
    accent: 'text-purple-700',
    hint: 'This is the complete description of this tourism place. Plan your visit accordingly.',
  },
  bestTime: {
    accent: 'text-emerald-700',
    hint: 'Visit during these months for the best experience and weather conditions.',
  },
  visitTime: {
    accent: 'text-blue-700',
    hint: 'Recommended duration to fully explore and enjoy this destination.',
  },
  safety: {
    accent: 'text-orange-700',
    hint: 'Safety information and travel advisories for this location.',
  },
  languages: {
    accent: 'text-indigo-700',
    hint: 'Local languages spoken in this area. Consider learning basic phrases!',
  },
};

export default function TourismDetailModal({
  isOpen,
  onClose,
  title,
  icon,
  content,
  type,
}: TourismDetailModalProps) {
  const config = typeConfig[type];

  const renderContent = () => {
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-2.5">
          {content.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                {idx + 1}
              </span>
              <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (type === 'description') {
      const paragraphs = content.split('\n\n').filter((p) => p.trim());
      if (paragraphs.length > 1) {
        return (
          <div className="space-y-4">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="text-gray-700 text-sm leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        );
      }
      const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
      if (sentences.length > 3) {
        return (
          <div className="space-y-3">
            {sentences.map((s, idx) => (
              <p key={idx} className="text-gray-700 text-sm leading-relaxed">
                {s}
              </p>
            ))}
          </div>
        );
      }
    }

    return <p className="text-gray-700 text-sm leading-relaxed">{content}</p>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className={`text-xl font-black ${config.accent}`}>{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {renderContent()}
        </div>

        {/* Hint footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-start gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-xs leading-relaxed">{config.hint}</p>
        </div>

        {/* Close */}
        <div className="px-6 pb-6 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
