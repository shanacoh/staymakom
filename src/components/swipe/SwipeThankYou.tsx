import { Heart } from "lucide-react";

export const SwipeThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#AD1414]/10 flex items-center justify-center mb-6">
        <Heart className="w-8 h-8 text-[#AD1414] fill-[#AD1414]" />
      </div>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">Merci !</h1>
      <p className="text-[#1a1a1a]/60 max-w-sm">On revient vite vers toi avec l'itinéraire parfait.</p>
    </div>
  );
};
