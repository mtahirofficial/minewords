import socialLinks from "../socials.json";

const SocialMedia = () => (
  <div className="social-card">
    <h3>Follow Us</h3>
    <p>Stay connected with our community and get the latest updates.</p>
    <div className="social-icons">
      {socialLinks.map((item) => (
        <a
          href={item.url}
          target="_blank"
          key={item.label}
          rel="noopener noreferrer"
          title={item.name}
          className="social-icon"
        >
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  </div>
);

export default SocialMedia;
