import localFont from "next/font/local";
import { IBM_Plex_Sans } from "next/font/google";
import NextNProgress from "nextjs-progressbar";
import { AnimatePresence } from "framer-motion";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Amplify } from "aws-amplify";
import awsExports from "../aws-exports";
import '@/styles/globals.scss'
import "@aws-amplify/ui-react/styles.css";

Amplify.configure({ ...awsExports, ssr: true });

const ibm = IBM_Plex_Sans({ subsets: ["latin"], weight: "400" });
const dsFont = localFont({ src: "../fonts/deathstar/death_star-webfont.woff" });

export default function App({ Component, pageProps, router }) {
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <NextNProgress />
        <main className={ibm.className}>
          <style jsx global>
            {`
              :root {
                --deathstar-font: ${dsFont.style.fontFamily};
              }
            `}
          </style>
          <AnimatePresence mode="wait" initial={false}>
            <Component {...pageProps} key={router.asPath} />
          </AnimatePresence>
        </main>
      </ThemeProvider>
    </>
  );
}
