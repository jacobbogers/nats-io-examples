This is the jwt of the "SYSTEM" (system) account, 

"issued" by the "operator" entity, the name of the operator = "operator02" you can find this with the command `nsc list keys`

(this is neither an account or user)

the "sub" is the "nkey" of the admin account

```json
{
  "jti": "5KJ4KCWKBJHQ7WOQBYC2QVWHH6HV3RUFDAZ4PKIIQFM64T4HJFEA",
  "iat": 1743870869,
  "iss": "OCICVCLMBXIFYZAHG5DGTFVPT4XFJU3YRROF4TSJH3VTHY6Y7QURKWNA",
  "name": "SYSTEM",
  "sub": "AAN4L2GI4QFQNGFBDXNDYGRLNQ2NA3ICB7S3CAQHCGBBHPDTZUOHSQWI",
  "nats": {
    "limits": {
      "subs": -1,
      "data": -1,
      "payload": -1,
      "imports": -1,
      "exports": -1,
      "wildcards": true,
      "conn": -1,
      "leaf": -1
    },
    "default_permissions": {
      "pub": {},
      "sub": {}
    },
    "authorization": {},
    "type": "account",
    "version": 2
  }
}
```