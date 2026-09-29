import React from "react";
import Menuitems from "./MenuItems";
import { Box, Typography } from "@mui/material";
import {
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { IconPoint } from '@tabler/icons-react';
import Link from "next/link";
import { usePathname } from "next/navigation";


const renderMenuItems = (items: any, pathDirect: any) => {

  return items.map((item: any) => {

    const Icon = item.icon ? item.icon : IconPoint;

    const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

    if (item.subheader) {
      // Display Subheader
      return (
        <Menu
          subHeading={item.subheader}
          key={item.subheader}
        />
      );
    }

    //If the item has children (submenu)
    if (item.children) {
      return (
        <Submenu
          key={item.id}
          title={item.title}
          icon={itemIcon}
          borderRadius='6px'
        >
          {renderMenuItems(item.children, pathDirect)}
        </Submenu>
      );
    }

    // If the item has no children, render a MenuItem

    return (
      <Box px={2} key={item.id} mt={0.5}>
        <MenuItem
          key={item.id}
          isSelected={pathDirect === item?.href}
          borderRadius='6px'
          icon={itemIcon}
          link={item.href}
          component={Link}
        >
          <Typography variant="body1" sx={{ color: pathDirect === item?.href ? '#FFFFFF' : 'text.primary', fontWeight: pathDirect === item?.href ? 700 : 500 }}>
            {item.title}
          </Typography>
        </MenuItem >
      </Box>

    );
  });
};


const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;

  return (
    <Box sx={{ py: 3 }}>
      <MUI_Sidebar width={"100%"} showProfile={false} themeColor={"#FF5C00"} themeSecondaryColor={'rgba(255, 92, 0, 0.1)'} >
        
        <Box px={3} mb={4} display="flex" alignItems="center" sx={{ userSelect: 'none' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              letterSpacing: '-0.04em',
              background: 'linear-gradient(90deg, #FAFAFA 0%, #A1A1AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}
          >
            Build<span style={{ color: '#FF5C00', WebkitTextFillColor: '#FF5C00' }}>OS</span>
          </Typography>
        </Box>

        {renderMenuItems(Menuitems, pathDirect)}
        
      </MUI_Sidebar>
    </Box>
  );
};
export default SidebarItems;
