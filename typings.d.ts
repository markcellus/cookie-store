declare global {
  interface Window {
    chai: {
      expect: Chai.ExpectStatic;
    };
  }
}
export {};
