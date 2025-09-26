"use client";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import GlobalLoadingWrapper from "@/components/GlobalLoadingWrapper";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ReduxProvider store={store}>
			<Auth0Provider>
				<GlobalLoadingWrapper>
					{children}
				</GlobalLoadingWrapper>
			</Auth0Provider>
		</ReduxProvider>
	);
}
