// src/components/ProtectedRoute.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role;

      if (!session || (allowedRoles.length && !allowedRoles.includes(role))) {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, allowedRoles]);

  return children;
}

export default ProtectedRoute;
