import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Patients } from "@/pages/Patients";
import { PatientProfile } from "@/pages/PatientProfile";
import { MRIUpload } from "@/pages/MRIUpload";
import { MRIProcessing } from "@/pages/MRIProcessing";
import { MRIResults } from "@/pages/MRIResults";
import { LongitudinalComparison } from "@/pages/LongitudinalComparison";
import { ClinicalEvidence } from "@/pages/ClinicalEvidence";
import { CognitiveAssessment } from "@/pages/CognitiveAssessment";
import { SpeechAssessment } from "@/pages/SpeechAssessment";
import { Reports } from "@/pages/Reports";
import { Notifications } from "@/pages/Notifications";
import { Settings } from "@/pages/Settings";
import { Help } from "@/pages/Help";
import { NotFound } from "@/pages/NotFound";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { clinician } = useAuth();
  if (!clinician) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:patientId" element={<PatientProfile />} />
        <Route path="/mri/upload" element={<MRIUpload />} />
        <Route path="/mri/processing/:patientId" element={<MRIProcessing />} />
        <Route path="/mri/results/:patientId" element={<MRIResults />} />
        <Route path="/longitudinal" element={<LongitudinalComparison />} />
        <Route path="/evidence" element={<ClinicalEvidence />} />
        <Route path="/cognitive" element={<CognitiveAssessment />} />
        <Route path="/speech" element={<SpeechAssessment />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
