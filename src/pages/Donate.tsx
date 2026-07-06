import React, { useState } from 'react';
import { Heart, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageTransition from '@/components/PageTransition';

const Donate = () => {
  const [copied, setCopied] = useState(false);
  const paypalLink = 'https://paypal.me/angelicasuroy';
  const displayName = 'Rabbitmeow';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paypalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonate = () => {
    window.open(paypalLink, '_blank', 'noopener,noreferrer');
  };

  const donationTiers = [
    {
      amount: '$5',
      description: 'Coffee Support',
      emoji: '☕',
    },
    {
      amount: '$10',
      description: 'Meal Support',
      emoji: '🍽️',
    },
    {
      amount: '$25',
      description: 'Movie Night',
      emoji: '🎬',
    },
    {
      amount: '$50',
      description: 'Premium Support',
      emoji: '⭐',
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Heart className="h-16 w-16 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Support {displayName}
            </h1>
            <p className="text-lg text-white/70 mb-2">
              Help us keep {displayName} running and improve your streaming experience
            </p>
            <p className="text-sm text-white/50">
              Your support means everything to us!
            </p>
          </div>

          {/* Main CTA */}
          <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-lg p-8 mb-12 backdrop-blur-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Make a Donation
              </h2>
              <p className="text-white/70 mb-6">
                Every contribution helps us provide better content and features for everyone
              </p>
              <Button
                onClick={handleDonate}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center mx-auto gap-2"
              >
                <Heart className="h-5 w-5" />
                Donate via PayPal
                <ExternalLink className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Donation Tiers */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Suggested Amounts
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {donationTiers.map((tier, index) => (
                <button
                  key={index}
                  onClick={handleDonate}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-lg p-4 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="text-3xl mb-2">{tier.emoji}</div>
                  <div className="text-xl font-bold text-white mb-1">
                    {tier.amount}
                  </div>
                  <div className="text-xs text-white/60 group-hover:text-white/80">
                    {tier.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Why Support {displayName}?
            </h3>
            <ul className="space-y-3 text-white/70">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">✓</span>
                <span>Help maintain and improve the platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">✓</span>
                <span>Support server costs and infrastructure</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">✓</span>
                <span>Enable new features and content updates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">✓</span>
                <span>Show appreciation for our work</span>
              </li>
            </ul>
          </div>

          {/* Copy Link Section */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Share or Copy Link
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-black/50 border border-white/10 rounded px-4 py-3 flex items-center justify-between">
                <code className="text-white/70 text-sm break-all">
                  {paypalLink}
                </code>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 text-white/50 text-sm">
            <p>
              All donations are processed securely through PayPal.
              <br />
              Thank you for supporting {displayName}!
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Donate;
