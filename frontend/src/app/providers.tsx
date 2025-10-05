"use client";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ReduxProvider store={store}>
			<AuthProvider>
				{children}
			</AuthProvider>
		</ReduxProvider>
	);
}
