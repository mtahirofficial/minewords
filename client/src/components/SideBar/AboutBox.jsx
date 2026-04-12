import { Link } from "react-router-dom";

const AboutBox = () => (
    <div className="about-box">
        <h3>About MineWords</h3>
        <p>MineWords is a community-driven platform for sharing knowledge and insights.</p>
        <Link to="/about" className="learn-more-about">Learn More â†’</Link>
    </div>

);

export default AboutBox;

