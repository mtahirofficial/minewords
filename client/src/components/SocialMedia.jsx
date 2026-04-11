const socials = [
  {
    icon: "f",
    link: "https://www.facebook.com/minewordsofficial",
  },
];

const SocialMedia = () => (
  <div className="social-card">
    <h3>Follow Us</h3>
    <p>Stay connected with our community and get the latest updates.</p>
    <div className="social-icons">
      {socials.map((item) => (
        <a
          href={item.link}
          target="_blank"
          key={item.icon}
          className="social-icon"
        >
          <span>{item.icon}</span>
        </a>
      ))}
    </div>
  </div>
);

export default SocialMedia;
