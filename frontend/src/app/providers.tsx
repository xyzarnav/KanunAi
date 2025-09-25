"use client";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ReduxProvider store={store}>
			<Auth0Provider>{children}</Auth0Provider>
		</ReduxProvider>
	);
}
