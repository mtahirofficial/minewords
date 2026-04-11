import { Link } from "react-router-dom";

const DynamicAboutBox = ({
  siteName = "our platform",
  totalPosts = 0,
  totalCategories = 0,
}) => (
  <div className="about-box">
    <h3>About {siteName}</h3>
    <p>
      {siteName} is a community-driven platform for sharing knowledge and
      insights. .
    </p>
    <Link to="/about" className="learn-more-about">
      Learn More
    </Link>
  </div>
);

export default DynamicAboutBox;
