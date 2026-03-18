import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SERVER_URL from '../services/serverURL';
import { FaStar } from 'react-icons/fa';

const Review = () => {
  const { taskId } = useParams();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use local axios instance to avoid global interceptors ensuring no redirects
      const publicApi = axios.create({
        baseURL: SERVER_URL,
        withCredentials: true,
      });

      const response = await publicApi.post('/api/reviews', {
        task_id: taskId,
        rating,
        comment,
      });

      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your review has been submitted successfully.</p>
          <p className="text-sm text-gray-500">You can now close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white text-center">Rate Your Experience</h1>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6 text-center">
              <label className="block text-gray-700 font-medium mb-2">How was the service?</label>
              <div className="flex justify-center gap-2">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <label key={index} className="cursor-pointer">
                      <input
                        type="radio"
                        className="hidden"
                        value={ratingValue}
                        onClick={() => setRating(ratingValue)}
                      />
                      <FaStar
                        className="transition-colors duration-200"
                        color={ratingValue <= (hover || rating) ? '#ffc107' : '#e4e5e9'}
                        size={32}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                      />
                    </label>
                  );
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-yellow-600 mt-1 font-medium">
                  {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Add a comment (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                placeholder="Tell us what you liked or how we can improve..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Review;
