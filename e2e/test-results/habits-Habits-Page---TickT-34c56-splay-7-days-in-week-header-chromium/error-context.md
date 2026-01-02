# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Welcome back" [level=3] [ref=e6]
      - paragraph [ref=e7]: Enter your credentials to access your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email
          - generic [ref=e11]:
            - img [ref=e12]
            - textbox "Email" [ref=e15]:
              - /placeholder: name@example.com
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]: Password
            - link "Forgot password?" [ref=e19] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e20]:
            - img [ref=e21]
            - textbox "Password" [ref=e24]:
              - /placeholder: Enter your password
        - button "Sign in" [ref=e25] [cursor=pointer]
      - generic [ref=e30]: Or continue with
      - button "Continue with Google" [ref=e31] [cursor=pointer]:
        - img
        - text: Continue with Google
    - paragraph [ref=e33]:
      - text: Don't have an account?
      - link "Sign up" [ref=e34] [cursor=pointer]:
        - /url: /register
```