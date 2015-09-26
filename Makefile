

all: env deps node_modules

deps: env requirements.txt
	. env/bin/activate && python -m pip install -r requirements.txt

env:
	virtualenv --no-site-packages -p python3 --prompt '(fragofonias)' env

node_modules:
	npm install
