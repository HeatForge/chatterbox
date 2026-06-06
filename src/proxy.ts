import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./server/better-auth";

export async function proxy(request: NextRequest) {
    
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
        const url = new URL("/", request.url);
        url.searchParams.set("wasBooted", "true");
        return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
}

// Insert all prohibited paths here
export const config = {
    matcher: ["/chat/:path*", "/api/:path*"],
}