import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { DadosContador } from '../../interface/dadoscontador';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Database, get, ref, set } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-geradorsenha',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,NgxSpinnerModule, FormsModule],
  templateUrl: './geradorsenha.component.html',
  styleUrl: './geradorsenha.component.scss'
})
export class GeradorsenhaComponent implements OnInit{
  count: number = 0;
  countNormal: number = 0;
  countPreferencial: number = 0;
  senhaPreferencial: number = 0;
  senhaNormal: number =0;
  senha: DadosSenha [] = [];
  senhaVerificar: DadosSenha[] =[];
  cadastrarSenha: DadosSenha = new DadosSenha;
  contadorSenha: DadosContador[] = [];
  operador: string ='';
  //VARIÁVEL QUE CRIA FORMULARIO
  formulario!: FormGroup;
 //VARIÁVEL DE BUSCA
  formularioBusca!: FormGroup;
  // ACESSAR TELA CONVENCIONAL
  convencional: boolean = false;

//SETORES 
setoresDisponiveis = ['CONSULTA', 'REALIZAR AGENDAMENTO', 'EXAME', 'RESULTADO DE EXAMES'];

siglasSetores: Record<string, string> = {
  'CONSULTA': 'CO',
  'REALIZAR AGENDAMENTO': 'RA',
  'EXAME': 'EX',
  'RESULTADO DE EXAMES': 'RE'
};

  setorSelecionado: string = ''; // Setor escolhido
 
  constructor(
  private adminService: AdminService,
  private formBuilder: FormBuilder,
  private spinner: NgxSpinnerService,
  private db: Database, // Injeta o serviço do Firebase Realtime Database
  private router: Router,
  private authService: AuthService
  ){}

  // Método inicial executado ao carregar o componente
 async ngOnInit(){
  // Verifica se o usuário está autenticado ao carregar o componente
  if (!this.authService.isUserAuthenticated()) {
    this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
  } else {
    //this.formbuilder();
   // this.formBusca();
    this.convencional = false;
    this.selecionarSetor
    await this.carregarSetores();
   await this.adminService.getContadorSenhaConvencional().subscribe( d => {
        
      console.log(d);
      console.log(d.length);
      this.senha = d;
      console.log(this.senha);

     
    });
      
}
  }



// Método para apagar o contador de senhas e limpar as senhas geradas

  // Carrega os setores do Firebase
  async carregarSetores() {
    const setoresRef = ref(this.db, `avelar/setor`);
    const snapshot = await get(setoresRef);

    if (snapshot.exists()) {
      const setoresData = snapshot.val() as Record<string, { setor: string }>;
      this.setoresDisponiveis = Object.values(setoresData).map((item) => item.setor);
  
     
    } else {
      console.log('Nenhum setor encontrado no banco de dados.');
    }
  }

   // Método para selecionar um setor e avançar para a tela de senhas
   selecionarSetor(setor: string) {
    this.setorSelecionado = setor;
    this.convencional = true;
  }

  // Gera uma nova senha normal
  async novaSenhaNormal() {
    this.gerarSenha(false);
  }


// Gera uma nova senha preferencial
async novaSenhaPreferencial() {
  this.gerarSenha(true);
}
  



  
  // Busca a quantidade de senhas geradas no modo convencional
  // Método para gerar senhas
  async gerarSenha(preferencial: boolean) {
    this.spinner.show();

    if (!this.setorSelecionado) {
      alert('Por favor, selecione um setor antes de gerar a senha.');
      this.spinner.hide();
      return;
    }

   
    this.cadastrarSenha.setor = this.setorSelecionado;

      // Pega sigla do setor da lista fixa
  const siglaSetor = this.siglasSetores[this.setorSelecionado] || 'GEN';

     // Recuperar contador de senhas
  const contadorRef = ref(this.db, `avelar/senhacontador/${siglaSetor}`);
  const snapshotContador = await get(contadorRef);
  let contador = snapshotContador.exists() ? snapshotContador.val() : 0;

  // Criar número da senha
  let numeroSenha = contador + 1;
  await set(contadorRef, numeroSenha);

  this.cadastrarSenha.senha = `${siglaSetor}${numeroSenha.toString().padStart(2, '0')}`;
  this.cadastrarSenha.status = '0';
  this.cadastrarSenha.senhaid = Date.now().toString();

    console.log('Senha gerada:', this.cadastrarSenha.senha);

    // Salvar e imprimir senha
    await this.adminService.salvaSenhaContadorConvencional(this.cadastrarSenha);
    await this.adminService.salvaSenhaConvencionalRealime(this.cadastrarSenha)
      .then(async () => {
        await this.adminService.imprimir(this.cadastrarSenha).subscribe(() => {
          this.spinner.hide();
          this.convencional = false; // Volta para a seleção de setores
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  
  async mudarSetor(){
    this.convencional = false
  }
  
// Busca a quantidade de senhas geradas para um operador específico 
async buscaQuantidadeSenhasGeradas(senha: DadosSenha) {
  this.count = 0;

  await this.adminService.getContadorSenha(senha.operador).then((d) => {
    this.count = d.length + 1;
  });

  this.cadastrarSenha.senha = 'TS' + this.count.toString();

  //await this.adminService.salvaSenhaRealTime(this.cadastrarSenha);
  await this.adminService.salvaSenhaEvento(this.cadastrarSenha).then(async () => {
   /* await this.adminService.imprimir(this.cadastrarSenha).subscribe(() => {
      this.spinner.hide();
    });
  */});
}


}


