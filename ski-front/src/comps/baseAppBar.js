// Main navigation bar component using Material-UI
import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

export default function ButtonAppBar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    handleMenuClose();
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, width: "100%" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                const user = localStorage.getItem("user");
                if (user) {
                  try {
                    const parsed = JSON.parse(user);
                    const role = parsed.role || parsed;
                    console.log(role);
                    handleNavigate(`/${role}`);
                  } catch {
                    // fallback if it's just a plain string
                    localStorage.removeItem("user");
                    handleNavigate("/");
                  }
                } else {
                  handleNavigate("/");
                }
              }}
            >
              Home
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleNavigate("/login");
                if (localStorage.getItem("user")) {
                  localStorage.removeItem("user");
                }
              }}
            >
              {localStorage.getItem("user") ? "Logout" : "Login"}
            </MenuItem>
          </Menu>

          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, textAlign: "center" }}
          >
            Ski League Management System
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
