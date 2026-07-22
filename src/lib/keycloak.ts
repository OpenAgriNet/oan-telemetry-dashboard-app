import Keycloak from "keycloak-js";
import { KEYCLOAK_CONFIG } from "../config/environment";

const keycloak = new Keycloak(KEYCLOAK_CONFIG);

export default keycloak;
