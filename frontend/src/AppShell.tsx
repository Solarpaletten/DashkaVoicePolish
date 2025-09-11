import React from 'react';
import { useMediaQuery } from 'react-responsive';
import DashboardDesktop from './components/Dashboard/DashboardDesktop';
import DashboardTablet from './components/Dashboard/DashboardTablet';  
import DashboardMobile from './components/Dashboard/DashboardMobile';

function AppShell() {
  const isDesktop = useMediaQuery({ minWidth: 1025 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isMobile = useMediaQuery({ maxWidth: 767 });

  if (isDesktop) return <DashboardDesktop />;
  if (isTablet) return <DashboardTablet />;
  return <DashboardMobile />;
}

export default AppShell;

