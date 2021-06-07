import { AppProps } from 'next/app'
import { Header } from '../components/Header';
import { Provider as NextAuthProvider } from 'next-auth/client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

import './../styles/global.scss';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NextAuthProvider session={pageProps.session}>
      <Header />
      <Component {...pageProps} />
      <ToastContainer 
        autoClose={3000}
      />
    </NextAuthProvider>
  )
}

export default MyApp
