import Image from 'next/image';

export default function ExpertisePartners() {
  const partners = [
    {
      name: 'Genetec',
      category: 'Unified Physical Security Software',
      description: 'Video surveillance, access control, and integrated security management platform.',
      logo: 'https://brandsoftheworld.com/wp-content/uploads/images/logos/genetec-inc/genetec-inc-logo.png',
      url: 'https://www.genetec.com',
      alt: 'Genetec - Unified Security Software Platform',
    },
    {
      name: 'Gallagher',
      category: 'Access Control & Security Systems',
      description: 'Global leader in integrated access control, video, and security solutions.',
      logo: 'https://security.gallagher.com/-/media/project/gallagher/images/logos/gallagher-symbol-white.svg',
      url: 'https://security.gallagher.com',
      alt: 'Gallagher Security - Access Control Solutions',
    },
    {
      name: 'Inner Range',
      category: 'Smart Security Systems',
      description: 'Australian manufacturer of advanced access control and intrusion detection systems.',
      logo: 'https://brandfetch.com/innerrange.com/logo',
      url: 'https://www.innerrange.com.au',
      alt: 'Inner Range - Smart Security Systems',
    },
    {
      name: 'Tecom',
      category: 'Access Control Hardware',
      description: 'Taiwan-based manufacturer of access control and smart security hardware solutions.',
      logo: 'https://seeklogo.com/images/T/Tecom-logo-EC17E081C4-seeklogo.com.png',
      url: 'https://www.tecomemail.com',
      alt: 'Tecom - Access Control Hardware',
    },
  ];

  return (
    <section className="expertise-partners">
      <div className="container">
        <div className="expertise-header">
          <span className="eyebrow">Our Expertise</span>
          <h2>Integrated With Industry-Leading Manufacturers</h2>
          <p className="lead">
            Teracom Solutions works with and supports the world's leading security manufacturers
            to deliver integrated, best-in-class hardware and software solutions.
          </p>
        </div>

        <div className="partners-grid">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-card"
              title={partner.alt}
            >
              <div className="partner-logo">
                <Image
                  src={partner.logo}
                  alt={partner.alt}
                  width={200}
                  height={100}
                  quality={85}
                  onError={(e) => {
                    // Fallback: show partner name if image fails
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="partner-fallback" style={{ display: 'none' }}>
                  {partner.name}
                </div>
              </div>
              <div className="partner-info">
                <h3 className="partner-name">{partner.name}</h3>
                <p className="partner-category">{partner.category}</p>
                <p className="partner-description">{partner.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
