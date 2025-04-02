import { useState } from 'react';
import { Mission } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/appStore';
import { Smile, Meh, Frown } from 'lucide-react';

interface FeedbackFormProps {
  mission: Mission;
  onFeedbackSubmit: () => void;
}

export function FeedbackForm({ mission, onFeedbackSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const { addFeedback } = useAppStore();

  const handleSubmit = () => {
    if (rating !== null) {
      addFeedback(mission.id, rating, comment);
      onFeedbackSubmit();
    }
  };

  return (
    <div className="mission-card animate-fade-in space-y-4">
      <h3 className="text-xl font-semibold">Comment s'est passée cette mission ?</h3>
      
      <p className="text-muted-foreground">
        Votre retour m'aide à mieux adapter les futures missions à vos besoins.
      </p>
      
      <div className="flex justify-center gap-8 py-4">
        <button
          onClick={() => setRating(1)}
          className={`feedback-emoji ${rating === 1 ? 'text-red-500 scale-125' : 'text-gray-400'}`}
          aria-label="Pas satisfait"
        >
          <Frown size={36} />
        </button>
        
        <button
          onClick={() => setRating(3)}
          className={`feedback-emoji ${rating === 3 ? 'text-yellow-500 scale-125' : 'text-gray-400'}`}
          aria-label="Neutre"
        >
          <Meh size={36} />
        </button>
        
        <button
          onClick={() => setRating(5)}
          className={`feedback-emoji ${rating === 5 ? 'text-green-500 scale-125' : 'text-gray-400'}`}
          aria-label="Satisfait"
        >
          <Smile size={36} />
        </button>
      </div>
      
      <Textarea
        placeholder="Des commentaires supplémentaires ? (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="resize-none"
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={rating === null}
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
}
