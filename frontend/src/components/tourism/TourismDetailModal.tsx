"use client";

import Modal from "@/components/common/Modal";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

interface TourismDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  content: string | string[];
  type: 'description' | 'bestTime' | 'visitTime' | 'safety' | 'languages';
}

const typeConfig: Record<TourismDetailModalProps['type'], { accent: string }> = {
  description: { accent: 'text-purple-700' },
  bestTime:    { accent: 'text-emerald-700' },
  visitTime:   { accent: 'text-blue-700' },
  safety:      { accent: 'text-orange-700' },
  languages:   { accent: 'text-indigo-700' },
};

// Translates a single string content block
function TranslatedContent({ content, type }: { content: string; type: string }) {
  const translated = useTranslateText(content);

  if (type === 'description') {
    const paragraphs = translated.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-gray-700 text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      );
    }
    const sentences = translated.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    if (sentences.length > 3) {
      return (
        <div className="space-y-3">
          {sentences.map((s, idx) => (
            <p key={idx} className="text-gray-700 text-sm leading-relaxed">{s}</p>
          ))}
        </div>
      );
    }
  }

  return <p className="text-gray-700 text-sm leading-relaxed">{translated}</p>;
}

// Translates a single list item
function TranslatedListItem({ item, idx }: { item: string; idx: number }) {
  const translated = useTranslateText(item);
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
        {idx + 1}
      </span>
      <span className="text-gray-700 text-sm leading-relaxed">{translated}</span>
    </li>
  );
}

export default function TourismDetailModal({
  isOpen,
  onClose,
  title,
  icon,
  content,
  type,
}: TourismDetailModalProps) {
  const config = typeConfig[type];
  const { t } = useTranslation();
  const translatedTitle = useTranslateText(title);

  const renderContent = () => {
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-2.5">
          {content.map((item, idx) => (
            <TranslatedListItem key={idx} item={item} idx={idx} />
          ))}
        </ul>
      );
    }
    return <TranslatedContent content={content} type={type} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className={`text-xl font-black ${config.accent}`}>{translatedTitle}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {renderContent()}
        </div>

        {/* Close */}
        <div className="px-6 pb-6 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
