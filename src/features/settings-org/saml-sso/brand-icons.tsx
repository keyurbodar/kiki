import { cx } from "class-variance-authority";
import auth0Url from "./brand/auth0.svg?url";
import googleUrl from "./brand/google.svg?url";
import jumpcloudUrl from "./brand/jumpcloud.svg?url";
import keycloakUrl from "./brand/keycloak.svg?url";
import microsoftUrl from "./brand/microsoft.svg?url";
import oktaUrl from "./brand/okta.svg?url";
import oneloginUrl from "./brand/onelogin.svg?url";
import oneloginMaskUrl from "./brand/onelogin-mask.svg?url";

const iconClass = "size-(--icon-base) shrink-0 opacity-100";

function BrandImage({ src, darkMask }: { src: string; darkMask?: string }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cx(iconClass, darkMask !== undefined && "dark:hidden")}
      />
      {darkMask !== undefined && (
        <span
          aria-hidden="true"
          className={cx(
            iconClass,
            "hidden bg-foreground mask-contain mask-center mask-no-repeat dark:block",
          )}
          style={{ maskImage: `url(${darkMask})` }}
        />
      )}
    </>
  );
}

export const GoogleIcon = () => <BrandImage src={googleUrl} />;
export const OktaIcon = () => <BrandImage src={oktaUrl} />;
export const MicrosoftIcon = () => <BrandImage src={microsoftUrl} />;
export const Auth0Icon = () => <BrandImage src={auth0Url} />;
export const JumpCloudIcon = () => (
  <BrandImage src={jumpcloudUrl} darkMask={jumpcloudUrl} />
);
export const KeycloakIcon = () => (
  <BrandImage src={keycloakUrl} darkMask={keycloakUrl} />
);
export const OneLoginIcon = () => (
  <BrandImage src={oneloginUrl} darkMask={oneloginMaskUrl} />
);
