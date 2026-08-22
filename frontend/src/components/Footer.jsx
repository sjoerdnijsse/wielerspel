function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <strong>GiroTourVuelta Wielerspel</strong>

        <span>
          Ontwikkeld door Sjoerd Nijsse · ©{" "}
          {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}

export default Footer;