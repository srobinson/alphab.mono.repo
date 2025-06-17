import { AppStates } from "./components/AppStates";
import Gallery from "./components/Gallery";
import { useAppState } from "./hooks/useAppState";
import "./gallery.css";

function App() {
  const appState = useAppState();

  // Check for app states first
  if (appState.computed.isInitialLoading || appState.gallery.error || appState.computed.isEmpty) {
    return (
      <AppStates
        isLoading={appState.computed.isInitialLoading}
        error={appState.gallery.error}
        isEmpty={appState.computed.isEmpty}
        totalImages={appState.gallery.totalImages}
      />
    );
  }

  // Show the main gallery
  return <Gallery appState={appState} />;
}

export default App;
