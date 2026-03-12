import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";

interface CategoryCardProps {
  category: {
    name: string;
    name_he: string | null;
    intro_rich_text: string | null;
    intro_rich_text_he: string | null;
    hero_image: string | null;
    slug: string;
  };
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const { lang } = useLanguage();
  const title = getLocalizedField(category, 'name', lang) as string;
  const image = category.hero_image || '';
  
  // Split title into exactly 2 lines
  const words = title.split(' ');
  const midpoint = Math.ceil(words.length / 2);
  const line1 = words.slice(0, midpoint).join(' ');
  const line2 = words.slice(midpoint).join(' ');
  
  return (
    <Link 
      to={`/category/${category.slug}?lang=${lang}`}
      className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-strong transition-smooth"
    >
      <div className="aspect-square relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-smooth" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <h3 className="font-sans text-xl md:text-2xl font-bold text-white text-center uppercase tracking-tight">
            <span className="block">{line1}</span>
            {line2 && <span className="block -mt-1.5">{line2}</span>}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;