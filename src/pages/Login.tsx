
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  
  useEffect(() => {
    document.title = "Login - Chatbot Insights";
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[450px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Chatbot Insights</CardTitle>
          <CardDescription>
            Sign in to access your analytics dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-6">
          <img 
            src="/placeholder.svg" 
            alt="Chatbot Insights Logo" 
            className="w-32 h-32 mb-6" 
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={login}>
            Sign In
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Keycloak
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
