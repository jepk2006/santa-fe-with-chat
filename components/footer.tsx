const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className='border-t bg-gray-50'>
      <div className='container py-6'>
        <div className='text-center text-sm text-gray-600'>
          <p>© {currentYear} Santa Fe. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 