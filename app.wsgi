import os
import sys
import runpy

cur_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, cur_dir)
activate_this = os.path.join(cur_dir, 'env', 'bin', 'activate_this.py')
runpy.run_path(activate_this)

env_variables_to_pass = ['CSA_DB_USERNAME', 'CSA_DB_PASSWORD']
def application(environ, start_response):
    # pass the WSGI environment variables on through to os.environ
    for var in env_variables_to_pass:
        os.environ[var] = environ.get(var, '')
    from views import app as _application
    return _application(environ, start_response)
