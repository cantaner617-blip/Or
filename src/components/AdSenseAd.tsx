import { useEffect } from 'react';

interface AdSenseAdProps {
  publisherId: string;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

export default function AdSenseAd({
  publisherId,
  slotId = 'default',
  format = 'auto',
  responsive = true,
  className = ''
}: AdSenseAdProps) {
  
  // Format publisher ID correctly
  let formattedPubId = publisherId.trim();
  if (formattedPubId) {
    if (formattedPubId.startsWith('pub-')) {
      formattedPubId = 'ca-' + formattedPubId;
    } else if (!formattedPubId.startsWith('ca-pub-')) {
      formattedPubId = 'ca-pub-' + formattedPubId;
    }
  }

  useEffect(() => {
    // Only attempt to push when window.adsbygoogle is available on production
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch (e) {
      console.warn('AdSense push failed (this is normal in development environments):', e);
    }
  }, [formattedPubId, slotId]);

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`} id={`adsense-wrapper-${slotId}`}>
      {/* Real Google AdSense Tag */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={formattedPubId}
        data-ad-slot={slotId === 'default' ? '1234567890' : slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
