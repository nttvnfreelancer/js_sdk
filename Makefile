DARWIN_BIN=./tools/BrowserStackLocal.darwin
$(DARWIN_BIN):
	mkdir -p ./tools
	(cd tools && wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip && unzip BrowserStackLocal-darwin-x64.zip && rm *.zip && mv BrowserStackLocal BrowserStackLocal.darwin && chmod +x BrowserStackLocal.darwin)

LINUX_x64_BIN=./tools/BrowserStackLocal.linux64
$(LINUX_x64_BIN):
	mkdir -p ./tools
	(cd tools && wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip && unzip BrowserStackLocal-linux-x64.zip && rm *.zip && mv BrowserStackLocal BrowserStackLocal.linux64 && chmod +x BrowserStackLocal.linux64)

.PHONY: run-browserstack-local
run-browserstack-local:
	$(BROWSER_STACK_LOCAL_BINARY) --key=$(BROWSER_STACK_KEY)

.PHONY: run-browserstack-local-for-jest
run-browserstack-local-for-jest:
	$(BROWSER_STACK_LOCAL_BINARY) --key=$(BROWSER_STACK_KEY) --local-identifier=$(BROWSER_STACK_LOCAL_IDENTIFIER)

.PHONY: clean
clean:
	cd dist; ls | grep -v -E "^public" | xargs rm -rf; cd ../
