const Hero = ({ title, description, primarytext, secondaryText, primaryAction, secondaryAction }) => {
    return (
        <section className="hero">
            <div className="container">
                <h1>{title}</h1>
                <p>{description}</p>
                <div className="buttons">
                    {
                        primarytext && primaryAction ? <button className="btn btn-primary" onClick={primaryAction}>{primarytext}</button> : null
                    }
                    {
                        secondaryText && secondaryAction ? <button className="btn btn-secondary" onClick={secondaryAction}>{secondaryText}</button> : null
                    }
                </div>
            </div>
        </section>

    );
};

export default Hero;
