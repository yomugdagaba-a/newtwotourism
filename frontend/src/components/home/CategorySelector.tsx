"use client";

interface Props {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const categories = [
  "HERITAGE",
  "HIGHLAND",
  "CAVERN",
  "AQUATICS",
  "CULTURE",
  "MODERN",
];

export default function CategorySelector({
  selectedCategories,
  setSelectedCategories,
}: Props) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((c) => c !== category)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => toggleCategory(category)}
          className={`px-4 py-2 rounded font-semibold border-2 transition
            ${
              selectedCategories.includes(category)
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-green-100"
            }`}
        >
          {category.charAt(0) + category.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}
