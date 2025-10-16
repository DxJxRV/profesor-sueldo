import { useEffect } from 'react';
import PropTypes from 'prop-types';

function AdSense({ 
  adClient = 'ca-pub-8947474348361670',
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = { display: 'block' },
  className = ''
}) {
  useEffect(() => {
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}

AdSense.propTypes = {
  adClient: PropTypes.string,
  adSlot: PropTypes.string,
  adFormat: PropTypes.string,
  fullWidthResponsive: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string
};

export default AdSense;
