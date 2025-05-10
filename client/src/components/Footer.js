import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light text-center text-lg-start mt-5">
      <Container>
        <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          © {new Date().getFullYear()} Bot-Forge - Telegram Bot Builder
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
