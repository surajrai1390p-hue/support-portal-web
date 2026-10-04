/**
 * @fileoverview Public-facing navigation bar.
 * Renders the company logo alongside Login and Register buttons.
 * Used on the landing page and other unauthenticated routes.
 */

import React from "react";
import { Flex, Button } from "antd";
import Image from "next/image";
import { useRouter } from "next/router";

/**
 * Navigation bar for unauthenticated pages.
 *
 * Displays the Sharp Minds logo and buttons to navigate to the login
 * or registration pages.
 */
function Navbar() {
  const router = useRouter()
  return (
    <>
      <header style={{ background: "#ffffff", padding: "0 20px" }}>
        <Flex justify="space-between" align="center" style={{ height: "100%" }}>
          <Image
            src="/sharpminds.png"
            alt="Sharp Minds"
            width={90}
            height={60}
            

          ></Image>
          <Flex gap="small">
            <Button size="small" type="primary" onClick={()=>{router.push("/login")}} >Login</Button>
            <Button size="small" type="primary" onClick={()=>{router.push("/register")}}> Register</Button>
          </Flex>
        </Flex>
      </header>
    </>
  );
}

export default Navbar;