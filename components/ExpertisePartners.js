import Image from 'next/image';

export default function ExpertisePartners() {
  const partners = [
    {
      name: 'Genetec',
      logo: 'https://www.genetec.com/static/images/logo.png',
      url: 'https://www.genetec.com',
      alt: 'Genetec - Unified Security Software',
    },
    {
      name: 'Gallagher',
      logo: 'https://security.gallagher.com/-/media/project/gallagher/images/logos/gallagher-logo-white.svg',
      url: 'https://security.gallagher.com',
      alt: 'Gallagher Security',
    },
    {
      name: 'Integriti',
      logo: 'https://www.integriti.com.au/images/logo.png',
      url: 'https://www.integriti.com.au',
      alt: 'Integriti - Access Control Systems',
    },
    {
      name: 'Tecom Challenger',
      logo: 'https://www.tecomemail.com/images/logo.png',
      url: 'https://www.tecomemail.com',
      alt: 'Tecom - Access Control',
    },
    {
      name: 'Milestone',
      logo: 'https://www.milestonesys.com/static/images/logo.png',
      url: 'https://www.milestonesys.com',
      alt: 'Milestone Systems - Video Management',
    },
    {
      name: 'HID',
      logo: 'https://www.hidglobal.com/images/logo.png',
      url: 'https://www.hidglobal.com',
      alt: 'HID Global - Access Control',
    },
    {
      name: 'Axis',
      logo: 'https://www.axis.com/images/logo.png',
      url: 'https://www.axis.com',
      alt: 'Axis - Network Video',
    },
    {
      name: 'Networking',
      logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"%3E%3Ctext x="50" y="50" font-size="20" fill="%23fff" text-anchor="middle" dominant-baseline="middle"%3ENETWORKING%3C/text%3E%3C/svg%3E',
      url: '#',
      alt: 'Network Infrastructure',
    },
    {
      name: 'Cyber Security',
      logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"%3E%3Ctext x="50" y="50" font-size="18" fill="%23fff" text-anchor="middle" dominant-baseline="middle"%3ECYBER SECURITY%3C/text%3E%3C/svg%3E',
      url: '#',
      alt: 'Cyber Security Solutions',
    },
  ];

  return (
    <section className="expertise-section">
      <div className="container">
        <div className="expertise-header">
          <span className="eyebrow">Industry Expertise</span>
          <h2>Technologies we understand.</h2>
          <p className="expertise-subtext">
            Teracom is built around the real platforms, products and technical challenges used across the
            electronic security industry.
          </p>
        </div>

        <div className="expertise-grid">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="expertise-card"
              title={partner.alt}
            >
              <div className="expertise-logo">
                <Image
                  src={partner.logo}
                  alt={partner.alt}
                  width={180}
                  height={80}
                  quality={85}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = partner.name.toUpperCase();
                  }}
                />
              </div>
              <span className="expertise-name">{partner.name.toUpperCase()}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
