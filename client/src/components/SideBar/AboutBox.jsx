import { Link } from "react-router-dom";

const AboutBox = () => (
    <div className="about-box">
        <h3>About Ziora</h3>
        <p>Ziora is a community-driven platform for sharing knowledge and insights.</p>
        <Link to="/about" className="learn-more-about">Learn More →</Link>
    </div>

);

export default AboutBox;
