import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ThreadPage from './pages/ThreadPage';
import NewThread from './pages/NewThread';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import LatestThreads from './pages/LatestThreads';
import StaticPage from './pages/StaticPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="main-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/latest" element={<LatestThreads />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/thread/:id" element={<ThreadPage />} />
              <Route path="/new-thread" element={<NewThread />} />
              <Route path="/new-thread/:categorySlug" element={<NewThread />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/page/:slug" element={<StaticPage />} />
              <Route path="/:slug" element={<StaticPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
