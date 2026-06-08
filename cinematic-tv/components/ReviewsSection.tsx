'use client';
import { useState, useEffect } from 'react';
import { db, auth, collection, setDoc, doc, onSnapshot, signInWithPopup, googleProvider, onAuthStateChanged } from '@/lib/firebase';
import { AlertCircle, MessageSquare, Star } from 'lucide-react';

type FirestoreDate = {
  toDate?: () => Date;
};

interface Review {
  userId: string;
  rating: number;
  text: string;
  createdAt: FirestoreDate | Date;
  updatedAt: FirestoreDate | Date;
}

export function ReviewsSection({ movieId }: { movieId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState(auth?.currentUser ?? null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!auth) {
      setUser(null);
      return undefined;
    }
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!db) {
      setReviews([]);
      setErrorMessage('Reviews are unavailable until Firebase is configured.');
      return undefined;
    }
    const reviewsRef = collection(db, 'movies', movieId, 'reviews');
    const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
      const fetched: Review[] = [];
      snapshot.forEach(doc => fetched.push(doc.data() as Review));
      // Sort by latest locally since we don't have indexes explicitly configured
      fetched.sort((a, b) => {
        const da = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });
      setReviews(fetched);
    }, (error) => {
      setErrorMessage(error.message);
    });
    
    return unsubscribe;
  }, [movieId]);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!auth || !googleProvider) {
      setErrorMessage('Firebase sign-in is not configured.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const calculateAverage = () => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  const myReview = reviews.find(r => r.userId === user?.uid);
  
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setText(myReview.text);
    }
  }, [myReview]);

  const handleSubmit = async () => {
    if (!user || !db) return;
    if (rating === 0 || !text.trim()) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const reviewRef = doc(db, 'movies', movieId, 'reviews', user.uid);
      const isUpdate = !!myReview;
      
      const payload: Review = {
        rating,
        text: text.slice(0, 500),
        userId: user.uid,
        updatedAt: new Date(),
        createdAt: isUpdate && myReview ? myReview.createdAt : new Date(),
      };
      
      await setDoc(reviewRef, payload, { merge: true });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 cinema-panel p-4 rounded-lg sm:p-5 md:p-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-3 font-display text-xl font-bold text-on-surface sm:text-2xl">
          <MessageSquare className="w-6 h-6 text-primary" />
          Reviews & Ratings
        </h3>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 bg-white/[0.06] px-4 py-2 rounded-md border border-white/10">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-xl font-bold font-display">{calculateAverage()}</span>
            <span className="text-sm text-on-surface-variant">({reviews.length})</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 flex gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-on-surface">
          <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
          {errorMessage}
        </div>
      )}

      <div className="mb-10 pb-10 border-b border-white/10">
        {!user ? (
          <div className="text-center p-6 bg-white/[0.04] rounded-lg border border-white/10">
            <p className="text-on-surface-variant mb-4">Sign in to leave a review</p>
            <button onClick={handleLogin} className="px-6 py-3 bg-white text-black font-bold rounded-md hover:bg-white/90 transition shadow-lg">
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-bold text-on-surface">{myReview ? 'Update your review' : 'Write a review'}</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-yellow-500 fill-yellow-500' : 'text-surface-variant'}`} />
                </button>
              ))}
            </div>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think of the movie?"
              className="h-32 w-full resize-none rounded-md border border-white/10 bg-surface p-4 text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-primary"
              maxLength={500}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <span className="text-xs text-on-surface-variant">{text.length}/500</span>
               <button 
                 onClick={handleSubmit} 
                 disabled={isSubmitting || rating === 0 || !text.trim()}
                 className="rounded-md bg-primary px-5 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
               >
                 {isSubmitting ? 'Saving...' : 'Submit Review'}
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((r, i) => (
            <div key={`${r.userId}-${i}`} className="p-5 rounded-lg bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-surface-variant'}`} />
                  ))}
                </div>
                <span className="text-xs text-on-surface-variant">
                  {r.updatedAt instanceof Date
                    ? r.updatedAt.toLocaleDateString()
                    : r.updatedAt?.toDate
                      ? r.updatedAt.toDate().toLocaleDateString()
                      : 'Just now'}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-on-surface">{r.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
